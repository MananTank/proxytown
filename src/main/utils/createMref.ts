import { $typeof } from '../../shared';
import { Mref, NonSharable } from '../../types';
import { $proxytown } from '../globals';

/**
 * create an Mref object for given value
 */
export function createMref(value: NonSharable): Mref {
	const { refToIdMap, Mrefs } = $proxytown;

	// if ref already created, use that
	if (refToIdMap.has(value)) {
		return {
			MrefId: refToIdMap.get(value)!,
			type: $typeof(value),
		};
	}

	Mrefs.push(value);
	const id = Mrefs.length - 1;
	refToIdMap.set(value, id);

	return {
		MrefId: id,
		type: $typeof(value),
	};
}
